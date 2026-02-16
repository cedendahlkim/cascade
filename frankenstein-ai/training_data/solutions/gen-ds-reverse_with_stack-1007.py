# Task: gen-ds-reverse_with_stack-1007 | Score: 100% | 2026-02-12T16:45:30.137630

n = int(input())
stack = []
for _ in range(n):
    stack.append(input())

print(' '.join(stack[::-1]))