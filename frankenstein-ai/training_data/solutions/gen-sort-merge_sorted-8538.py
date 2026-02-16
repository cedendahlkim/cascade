# Task: gen-sort-merge_sorted-8538 | Score: 100% | 2026-02-13T13:21:52.107995

n1 = int(input())
lst1 = [int(input()) for _ in range(n1)]
n2 = int(input())
lst2 = [int(input()) for _ in range(n2)]
print(' '.join(str(x) for x in sorted(lst1 + lst2)))