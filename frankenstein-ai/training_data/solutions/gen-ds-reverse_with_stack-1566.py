# Task: gen-ds-reverse_with_stack-1566 | Score: 100% | 2026-02-12T14:33:18.575136

n = int(input())
stack = []
for _ in range(n):
    stack.append(int(input()))

print(*stack[::-1])