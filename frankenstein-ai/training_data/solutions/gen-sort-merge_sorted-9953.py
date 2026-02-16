# Task: gen-sort-merge_sorted-9953 | Score: 100% | 2026-02-15T07:46:50.688528

n1 = int(input())
lst1 = [int(input()) for _ in range(n1)]
n2 = int(input())
lst2 = [int(input()) for _ in range(n2)]
print(' '.join(str(x) for x in sorted(lst1 + lst2)))