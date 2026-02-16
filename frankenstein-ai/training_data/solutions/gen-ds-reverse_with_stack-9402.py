# Task: gen-ds-reverse_with_stack-9402 | Score: 100% | 2026-02-10T15:43:55.671359

n = int(input())
stack = []
for _ in range(n):
    stack.append(input())

print(' '.join(stack[::-1]))