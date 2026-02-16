# Task: gen-ds-reverse_with_stack-4946 | Score: 100% | 2026-02-15T11:37:18.756036

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))