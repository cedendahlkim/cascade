# Task: gen-ds-reverse_with_stack-9259 | Score: 100% | 2026-02-12T15:42:40.139990

n = int(input())
stack = []
for _ in range(n):
    stack.append(input())

print(' '.join(stack[::-1]))