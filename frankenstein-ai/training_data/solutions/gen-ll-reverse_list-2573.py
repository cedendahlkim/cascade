# Task: gen-ll-reverse_list-2573 | Score: 100% | 2026-02-12T13:59:39.355350

n = int(input())
stack = []
for _ in range(n):
    stack.append(int(input()))

result = []
while stack:
    result.append(str(stack.pop()))

print(" ".join(result))