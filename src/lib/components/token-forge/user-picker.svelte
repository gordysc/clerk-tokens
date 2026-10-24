<script lang="ts">
  import * as Avatar from "#lib/components/ui/avatar/index.js";
  import * as Select from "#lib/components/ui/select/index.js";
  import type { UserSummary } from "#lib/types.js";

  let {
    users,
    value = $bindable(""),
    disabled = false
  }: {
    /** Users to list in the dropdown. */
    users: UserSummary[];
    /** Selected Clerk user id (bindable). */
    value?: string;
    /** Disables the trigger while work is in flight. */
    disabled?: boolean;
  } = $props();

  const selected = $derived(users.find(user => user.id === value));
</script>

{#snippet userRow(user: UserSummary)}
  <Avatar.Root class="border-border size-7 shrink-0 border">
    <Avatar.Image src={user.imageUrl} alt={user.name} />
    <Avatar.Fallback class="bg-secondary font-mono text-[10px]">
      {user.initials}
    </Avatar.Fallback>
  </Avatar.Root>
  <span class="flex min-w-0 flex-col items-start leading-tight">
    <span class="truncate text-sm font-medium">{user.name}</span>
    {#if user.email}
      <span class="text-muted-foreground truncate font-mono text-[11px]"
        >{user.email}</span
      >
    {/if}
  </span>
{/snippet}

<Select.Root type="single" bind:value {disabled}>
  <Select.Trigger
    class="w-full data-[size=default]:h-14 [&>span]:min-w-0"
    aria-label="Select a user"
  >
    {#if selected}
      <span class="flex min-w-0 items-center gap-2.5">
        {@render userRow(selected)}
      </span>
    {:else}
      <span class="text-muted-foreground">Select a user…</span>
    {/if}
  </Select.Trigger>
  <Select.Content class="max-h-80">
    {#each users as user (user.id)}
      <Select.Item value={user.id} label={user.name} class="py-2">
        {@render userRow(user)}
      </Select.Item>
    {/each}
  </Select.Content>
</Select.Root>
