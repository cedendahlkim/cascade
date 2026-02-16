# Task: gen-ds-reverse_with_stack-2312 | Score: 100% | 2026-02-15T14:00:05.866001

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))