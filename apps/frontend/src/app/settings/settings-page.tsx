"use client";

import React from "react";
import { Text, Card, Flex, Skeleton } from "@radix-ui/themes";
import type { User } from "@/lib/types";

interface SettingsPageProps {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export default function SettingsPage({
  user,
  loading,
  error,
}: SettingsPageProps) {
  return (
    <div className='max-w-2xl'>
      <Text size='6' weight='bold' className='mb-6 block'>
        Settings
      </Text>

      {loading ? (
        <Flex direction='column' gap='4'>
          <Skeleton>
            <Text>Loading...</Text>
          </Skeleton>
        </Flex>
      ) : error ? (
        <Card className='p-6 bg-[var(--color-panel)]'>
          <Text color='red'>{error}</Text>
        </Card>
      ) : user ? (
        <Card className='p-6 bg-[var(--color-panel)]'>
 
        </Card>
      ) : (
        <Card className='p-6 bg-[var(--color-panel)] border border-[var(--gray-a5)]'>
          <Text color='gray'>No user data available</Text>
        </Card>
      )}
    </div>
  );
}
