import React from "react";
import { Flex, Text } from "@radix-ui/themes";
import { Spinner } from "@radix-ui/themes";

export default function LoadingDisplay() {
  return (
    <div className="col-span-full flex items-center justify-center min-h-64">
      <Flex direction="column" align="center" gap="4">
        <Spinner size="3" />
        <Text size="3" color="gray">
          Loading directory contents...
        </Text>
      </Flex>
    </div>
  );
}
