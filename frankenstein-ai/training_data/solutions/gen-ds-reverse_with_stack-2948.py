# Task: gen-ds-reverse_with_stack-2948 | Score: 100% | 2026-02-12T12:50:54.896457

n = int(input())
stack = []
for _ in range(n):
    stack.append(input())

print(' '.join(stack[::-1]))