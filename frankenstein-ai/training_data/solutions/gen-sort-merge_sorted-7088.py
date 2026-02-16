# Task: gen-sort-merge_sorted-7088 | Score: 100% | 2026-02-15T09:50:34.890422

n1 = int(input())
lst1 = [int(input()) for _ in range(n1)]
n2 = int(input())
lst2 = [int(input()) for _ in range(n2)]
print(' '.join(str(x) for x in sorted(lst1 + lst2)))