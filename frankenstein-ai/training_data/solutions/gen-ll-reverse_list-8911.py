# Task: gen-ll-reverse_list-8911 | Score: 100% | 2026-02-12T13:03:21.905759

n = int(input())
stack = []
for _ in range(n):
    stack.append(input())

print(' '.join(stack[::-1]))