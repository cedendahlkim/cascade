# Task: gen-ds-reverse_with_stack-6347 | Score: 100% | 2026-02-12T21:17:43.669086

n = int(input())
stack = []
for _ in range(n):
    stack.append(input())

print(' '.join(stack[::-1]))