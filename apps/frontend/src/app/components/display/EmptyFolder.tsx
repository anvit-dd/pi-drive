import React from "react";
import { Flex, Text } from "@radix-ui/themes";
import { Telescope } from "lucide-react";

export default function EmptyFolder() {
  return (
    <div className="col-span-full flex items-center justify-center min-h-64">
      <Flex direction="column" align="center" gap="4">
        <Telescope size="96" strokeWidth="1" className="text-[var(--accent-10)]" />
        <Text size="8" color="gray" weight="medium" align="center" className="select-none">
          Nothing to see here...
        </Text>
      </Flex>
    </div>
  );
}
