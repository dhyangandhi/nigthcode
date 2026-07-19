import { useCallback } from "react";
import { useDialog } from "../../providers/dialog";
import { DialogSearchList } from "../dialog-search-list";
import { Mode } from "@nightcode/database";

const AVAILABLE_MODES: Mode[] = [Mode.BUILD, Mode.PLAIN];

type AgentsDialogContentProps = {
    currentMode: Mode;
    onSelectMode: (mode: Mode) => void;
};

function getModeLabel(mode: Mode) {
    return mode === Mode.PLAIN ? "Plan" : "Build";
}

export const AgentsDialogContext = ({ currentMode, onSelectMode }: AgentsDialogContentProps) => {
    const dialog = useDialog();
    
    const handleSelect = useCallback(
        (nextMode: Mode) => {
            onSelectMode(nextMode);
            dialog.close();
        },
        [onSelectMode, dialog],
    );
    
    return (
        <DialogSearchList 
            items={AVAILABLE_MODES}
            onSelect={handleSelect}
            filterFn={(item, query) => getModeLabel(item).toLocaleLowerCase().includes(query.toLocaleLowerCase())}
            renderItem={( item, isSelected ) => (
                <text selectable={false} fg={isSelected ? "black" : "white"}>
                    {item === currentMode ? " . " : " "}
                    {getModeLabel(item)}
                </text>
            )}
            getKey={(item) => item}
            placeHolder="Search agents"
            emptyText="No matching agents"
        />
    );
};