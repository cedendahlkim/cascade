# Task: gen-ds-reverse_with_stack-2965 | Score: 100% | 2026-02-12T19:12:05.060539

n = int(input())
stack = []
for _ in range(n):
    stack.append(input())

print(' '.join(stack[::-1]))