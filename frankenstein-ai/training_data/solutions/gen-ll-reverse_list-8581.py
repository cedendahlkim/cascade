# Task: gen-ll-reverse_list-8581 | Score: 100% | 2026-02-15T09:50:57.287635

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))