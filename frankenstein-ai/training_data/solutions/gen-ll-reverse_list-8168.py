# Task: gen-ll-reverse_list-8168 | Score: 100% | 2026-02-12T13:01:59.993872

n = int(input())
stack = []
for _ in range(n):
    stack.append(input())

print(' '.join(stack[::-1]))