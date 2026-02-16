# Task: gen-sort-merge_sorted-7600 | Score: 100% | 2026-02-13T19:05:35.998791

n1 = int(input())
lst1 = [int(input()) for _ in range(n1)]
n2 = int(input())
lst2 = [int(input()) for _ in range(n2)]
print(' '.join(str(x) for x in sorted(lst1 + lst2)))