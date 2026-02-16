# Task: gen-ll-reverse_list-3230 | Score: 100% | 2026-02-12T19:12:30.456345

n = int(input())
stack = []
for _ in range(n):
    stack.append(input())

print(' '.join(stack[::-1]))