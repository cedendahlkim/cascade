# Task: gen-sort-merge_sorted-4967 | Score: 100% | 2026-02-15T08:25:13.946039

n1 = int(input())
lst1 = [int(input()) for _ in range(n1)]
n2 = int(input())
lst2 = [int(input()) for _ in range(n2)]
print(' '.join(str(x) for x in sorted(lst1 + lst2)))