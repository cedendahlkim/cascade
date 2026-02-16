# Task: gen-ds-reverse_with_stack-8183 | Score: 100% | 2026-02-15T09:02:13.015675

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))