# Task: gen-ds-reverse_with_stack-4052 | Score: 100% | 2026-02-12T16:43:57.018570

n = int(input())
stack = []
for _ in range(n):
    stack.append(input())

print(' '.join(stack[::-1]))