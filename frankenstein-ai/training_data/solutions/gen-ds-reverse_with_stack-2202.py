# Task: gen-ds-reverse_with_stack-2202 | Score: 100% | 2026-02-12T12:50:09.525130

n = int(input())
stack = []
for _ in range(n):
    stack.append(input())

print(' '.join(stack[::-1]))