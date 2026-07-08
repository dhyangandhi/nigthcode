export function Header() {
    return (
        <box width="100%" flexDirection="column" alignItems="center">
            <box flexDirection="row" justifyContent="center" gap={0.5}>
                <ascii-font font="tiny" text="Night" color="gray" />
                <ascii-font font="tiny" text="Code" />
            </box>
        </box>
    );
};