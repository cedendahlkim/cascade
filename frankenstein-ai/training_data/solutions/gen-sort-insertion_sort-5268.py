# Task: gen-sort-insertion_sort-5268 | Score: 100% | 2026-02-14T12:08:29.174977

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))