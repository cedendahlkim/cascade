# Task: gen-ds-reverse_with_stack-7098 | Score: 100% | 2026-02-14T12:36:41.578772

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))