# Task: gen-ds-reverse_with_stack-4879 | Score: 100% | 2026-02-12T13:59:39.128498

n = int(input())
stack = []
for _ in range(n):
    stack.append(int(input()))

result = []
while stack:
    result.append(str(stack.pop()))

print(" ".join(result))