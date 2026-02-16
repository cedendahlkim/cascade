# Task: gen-ds-reverse_with_stack-4644 | Score: 100% | 2026-02-12T16:09:34.905765

n = int(input())
stack = []
for _ in range(n):
    stack.append(input())

print(' '.join(stack[::-1]))