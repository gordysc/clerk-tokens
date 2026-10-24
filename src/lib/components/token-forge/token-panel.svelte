<script lang="ts">
  import CheckIcon from "@lucide/svelte/icons/check";
  import CopyIcon from "@lucide/svelte/icons/copy";
  import TerminalIcon from "@lucide/svelte/icons/terminal";
  import { toast } from "svelte-sonner";
  import { Badge } from "#lib/components/ui/badge/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import { Separator } from "#lib/components/ui/separator/index.js";
  import { decodeJwt } from "#lib/jwt.js";
  import type { MintedToken, UserSummary } from "#lib/types.js";

  let {
    minted,
    user
  }: {
    /** The freshly minted token to display. */
    minted: MintedToken;
    /** The user the token belongs to, when still known client-side. */
    user?: UserSummary;
  } = $props();

  /** JWT segments, split so each can carry its own color (jwt.io style). */
  const segments = $derived(minted.token.split("."));
  const decoded = $derived(decodeJwt(minted.token));
  const expiresAtSeconds = $derived(
    typeof decoded?.payload.exp === "number" ? decoded.payload.exp : null
  );

  let nowMs = $state(Date.now());

  $effect(() => {
    const timer = setInterval(() => (nowMs = Date.now()), 1_000);

    return () => clearInterval(timer);
  });

  const secondsLeft = $derived(
    expiresAtSeconds === null
      ? null
      : Math.max(0, Math.floor(expiresAtSeconds - nowMs / 1_000))
  );
  const expired = $derived(secondsLeft !== null && secondsLeft <= 0);

  /**
   * Formats a duration in seconds as `mm:ss` (or `h:mm:ss` past an hour).
   */
  function formatCountdown(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3_600);
    const minutes = Math.floor((totalSeconds % 3_600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (value: number) => String(value).padStart(2, "0");

    return hours > 0
      ? `${hours}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(minutes)}:${pad(seconds)}`;
  }

  let copied: "token" | "header" | null = $state(null);

  /**
   * Copies the raw token or a ready-to-paste Authorization header.
   */
  async function copy(kind: "token" | "header"): Promise<void> {
    const text =
      kind === "token" ? minted.token : `Authorization: Bearer ${minted.token}`;

    await navigator.clipboard.writeText(text);
    copied = kind;
    toast.success(
      kind === "token" ? "Token copied" : "Authorization header copied"
    );
    setTimeout(() => {
      if (copied === kind) copied = null;
    }, 2_000);
  }
</script>

<section
  class="animate-in fade-in slide-in-from-bottom-2 bg-card/70 rounded-lg border shadow-lg shadow-black/20 backdrop-blur duration-500"
>
  <header class="flex flex-wrap items-center gap-2 px-5 py-3.5">
    <span
      class="inline-block size-1.5 rounded-full {expired
        ? 'bg-destructive'
        : 'animate-pulse bg-emerald-400'}"
    ></span>
    <h2
      class="text-muted-foreground font-mono text-[11px] tracking-[0.2em] uppercase"
    >
      Bearer token
    </h2>
    {#if user}
      <span class="text-muted-foreground text-xs">· {user.name}</span>
    {/if}
    <span class="grow"></span>
    {#if secondsLeft !== null}
      <Badge
        variant="outline"
        class="font-mono text-[11px] {expired
          ? 'border-destructive/50 text-destructive'
          : ''}"
      >
        {expired
          ? "expired — regenerate"
          : `expires in ${formatCountdown(secondsLeft)}`}
      </Badge>
    {/if}
    <Badge variant="secondary" class="font-mono text-[11px]"
      >tpl:{minted.template}</Badge
    >
    {#if minted.azp}
      <Badge variant="secondary" class="font-mono text-[11px]"
        >azp:{minted.azp}</Badge
      >
    {/if}
  </header>

  <Separator />

  <div class="space-y-4 p-5">
    <p
      class="bg-background/60 max-h-56 overflow-y-auto rounded-md border p-4 font-mono text-xs leading-relaxed break-all"
    >
      <span class="text-primary">{segments[0]}</span><span
        class="text-muted-foreground">.</span
      ><span class="text-foreground/90">{segments[1]}</span><span
        class="text-muted-foreground">.</span
      ><span class="text-sky-400/90">{segments[2]}</span>
    </p>

    <div class="flex flex-wrap gap-2">
      <Button class="font-medium" onclick={() => copy("token")}>
        {#if copied === "token"}
          <CheckIcon /> Copied
        {:else}
          <CopyIcon /> Copy token
        {/if}
      </Button>
      <Button variant="outline" onclick={() => copy("header")}>
        {#if copied === "header"}
          <CheckIcon /> Copied
        {:else}
          <TerminalIcon /> Copy as header
        {/if}
      </Button>
      <span class="grow"></span>
      <span class="text-muted-foreground self-center font-mono text-[11px]">
        {minted.sessionId}
      </span>
    </div>

    {#if decoded}
      <div>
        <h3
          class="text-muted-foreground mb-2 font-mono text-[11px] tracking-[0.2em] uppercase"
        >
          Decoded claims
        </h3>
        <pre
          class="bg-background/60 text-foreground/85 max-h-64 overflow-auto rounded-md border p-4 font-mono text-xs leading-relaxed">{JSON.stringify(
            decoded.payload,
            null,
            2
          )}</pre>
      </div>
    {/if}
  </div>
</section>
