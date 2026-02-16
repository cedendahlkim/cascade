# Task: gen-ds-reverse_with_stack-2749 | Score: 100% | 2026-02-11T12:09:35.462764

n = int(input())
stack = []
for _ in range(n):
    stack.append(input())

print(' '.join(stack[::-1]))