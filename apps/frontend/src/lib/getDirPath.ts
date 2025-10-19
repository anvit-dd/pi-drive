export default function getDirectoryPath(path:string) {
    const segments = path.split("/").filter(Boolean);

    if (segments.length === 0 || path === "" || path === "Home") {
        return "/home";
    } else {
        const firstSegment = segments[0];
        if (firstSegment.toLowerCase() === "home") {
            const restSegments = segments.slice(1);
            if (restSegments.length === 0) {
                return "/home";
            } else {
                return `/home/${restSegments.join("/")}`;
            }
        } else {
            return `/home/${segments.join("/")}`;
        }
    }
}
