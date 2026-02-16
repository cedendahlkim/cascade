# Task: gen-ll-reverse_list-4036 | Score: 100% | 2026-02-12T13:02:00.226841

n = int(input())
stack = []
for _ in range(n):
    stack.append(input())

print(' '.join(stack[::-1]))