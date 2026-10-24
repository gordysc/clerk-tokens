<script lang="ts">
  import KeyRoundIcon from "@lucide/svelte/icons/key-round";
  import LoaderCircleIcon from "@lucide/svelte/icons/loader-circle";
  import TriangleAlertIcon from "@lucide/svelte/icons/triangle-alert";
  import { toast } from "svelte-sonner";
  import TokenPanel from "#lib/components/token-forge/token-panel.svelte";
  import UserPicker from "#lib/components/token-forge/user-picker.svelte";
  import * as Alert from "#lib/components/ui/alert/index.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import { Skeleton } from "#lib/components/ui/skeleton/index.js";
  import type { MintedToken } from "#lib/types.js";
  import { getUsers, mintToken } from "./data.remote";

  const users = getUsers();

  let selectedUserId = $state("");
  let minting = $state(false);
  let minted: MintedToken | null = $state(null);

  const selectedUser = $derived(
    users.current?.find(user => user.id === selectedUserId)
  );

  /**
   * Extracts a display message from a failed remote call.
   */
  function messageOf(err: unknown): string {
    if (err && typeof err === "object" && "body" in err) {
      const body = (err as { body?: { message?: string } }).body;

      if (body?.message) return body.message;
    }

    return err instanceof Error ? err.message : "Something went wrong.";
  }

  /**
   * Mints a bearer token for the selected user via the remote command.
   */
  async function generate(): Promise<void> {
    if (!selectedUserId || minting) return;

    minting = true;

    try {
      minted = await mintToken(selectedUserId);
    } catch (err) {
      toast.error("Token generation failed", { description: messageOf(err) });
    } finally {
      minting = false;
    }
  }
</script>

<svelte:head>
  <title>Token Forge</title>
</svelte:head>

<div class="flex min-h-svh flex-col">
  <header class="border-border/70 border-b">
    <div
      class="text-muted-foreground mx-auto flex w-full max-w-2xl items-center justify-between px-6 py-3 font-mono text-[11px] tracking-[0.2em] uppercase"
    >
      <span
        >Token Forge <span class="text-primary">//</span> internal tooling</span
      >
      <span>clerk · local dev</span>
    </div>
  </header>

  <main class="mx-auto w-full max-w-2xl grow px-6 py-14">
    <p class="text-primary mb-3 font-mono text-xs tracking-[0.25em] uppercase">
      &gt;_ auth utility
    </p>
    <h1 class="text-4xl font-semibold tracking-tight">Token Forge</h1>
    <p class="text-muted-foreground mt-3 max-w-lg text-sm leading-relaxed">
      Mint a bearer token for any user in the Clerk instance, signed with the
      <code class="bg-secondary rounded px-1.5 py-0.5 font-mono text-xs"
        >default</code
      >
      JWT template, and hit the VeraSignal API as them.
    </p>

    <div class="mt-10 space-y-6">
      {#if users.error}
        <Alert.Root variant="destructive">
          <TriangleAlertIcon />
          <Alert.Title>Couldn't reach Clerk</Alert.Title>
          <Alert.Description>{messageOf(users.error)}</Alert.Description>
        </Alert.Root>
      {:else if users.current === undefined}
        <div class="bg-card/70 rounded-lg border p-5 backdrop-blur">
          <Skeleton class="mb-2.5 h-3 w-16" />
          <Skeleton class="h-14 w-full" />
          <Skeleton class="mt-4 h-10 w-full" />
        </div>
      {:else if users.current.length === 0}
        <Alert.Root>
          <TriangleAlertIcon />
          <Alert.Title>No users found</Alert.Title>
          <Alert.Description>
            This Clerk instance has no users yet — create one in the Clerk
            dashboard first.
          </Alert.Description>
        </Alert.Root>
      {:else}
        <section
          class="bg-card/70 rounded-lg border p-5 shadow-lg shadow-black/20 backdrop-blur"
        >
          <span
            class="text-muted-foreground mb-2.5 block font-mono text-[11px] tracking-[0.2em] uppercase"
          >
            User
            <span class="text-muted-foreground/60"
              >({users.current.length})</span
            >
          </span>
          <UserPicker
            users={users.current}
            bind:value={selectedUserId}
            disabled={minting}
          />

          <Button
            class="mt-4 w-full font-medium"
            size="lg"
            disabled={!selectedUserId || minting}
            onclick={generate}
          >
            {#if minting}
              <LoaderCircleIcon class="animate-spin" /> Minting…
            {:else}
              <KeyRoundIcon /> Generate bearer token
            {/if}
          </Button>
        </section>

        {#if minted}
          {#key minted.token}
            <TokenPanel {minted} user={selectedUser} />
          {/key}
        {:else}
          <div
            class="border-border/80 flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center"
          >
            <KeyRoundIcon class="text-muted-foreground/50 size-5" />
            <p class="text-muted-foreground text-sm">
              No token yet — pick a user and hit generate.
            </p>
          </div>
        {/if}
      {/if}
    </div>
  </main>

  <footer class="border-border/70 border-t">
    <p
      class="text-muted-foreground/70 mx-auto w-full max-w-2xl px-6 py-4 font-mono text-[11px] leading-relaxed"
    >
      Generating a token signs the user in for real via the Clerk Frontend API,
      creating a session with the azp claim set. Revoke stray sessions from the
      Clerk dashboard.
    </p>
  </footer>
</div>
