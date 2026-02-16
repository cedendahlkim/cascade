# Task: gen-sort-merge_sorted-3055 | Score: 100% | 2026-02-13T20:32:40.516193

n1 = int(input())
lst1 = [int(input()) for _ in range(n1)]
n2 = int(input())
lst2 = [int(input()) for _ in range(n2)]
print(' '.join(str(x) for x in sorted(lst1 + lst2)))