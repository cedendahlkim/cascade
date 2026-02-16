# Task: gen-sort-merge_sorted-3011 | Score: 100% | 2026-02-13T09:51:24.396636

n1 = int(input())
lst1 = [int(input()) for _ in range(n1)]
n2 = int(input())
lst2 = [int(input()) for _ in range(n2)]
print(' '.join(str(x) for x in sorted(lst1 + lst2)))