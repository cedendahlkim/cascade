# Task: gen-ds-reverse_with_stack-4136 | Score: 100% | 2026-02-14T12:07:58.262242

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))