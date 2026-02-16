# Task: gen-ll-reverse_list-7011 | Score: 100% | 2026-02-12T14:33:18.826581

n = int(input())
stack = []
for _ in range(n):
    stack.append(int(input()))

print(*stack[::-1])