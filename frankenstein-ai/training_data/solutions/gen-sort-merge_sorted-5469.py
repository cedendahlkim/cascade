# Task: gen-sort-merge_sorted-5469 | Score: 100% | 2026-02-15T13:30:50.399867

n1 = int(input())
lst1 = [int(input()) for _ in range(n1)]
n2 = int(input())
lst2 = [int(input()) for _ in range(n2)]
print(' '.join(str(x) for x in sorted(lst1 + lst2)))