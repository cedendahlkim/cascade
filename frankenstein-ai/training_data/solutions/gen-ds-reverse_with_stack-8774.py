# Task: gen-ds-reverse_with_stack-8774 | Score: 100% | 2026-02-13T10:14:55.776436

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))