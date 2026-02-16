# Task: gen-ds-reverse_with_stack-9663 | Score: 100% | 2026-02-15T10:10:04.254190

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))