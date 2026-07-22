import type { ReactNode } from "react";

export type EmptyBorderProps = {
    children?: ReactNode;
    [key: string]: any;
};

export function EmptyBorder(props: EmptyBorderProps) {
    return <box {...props} />;
}

export type BorderProps = {
    children?: ReactNode;
    [key: string]: any;
};

export function Border(props: BorderProps) {
    return <box {...props} />;
}
