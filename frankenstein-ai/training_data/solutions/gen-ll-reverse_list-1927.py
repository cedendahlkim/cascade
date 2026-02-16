# Task: gen-ll-reverse_list-1927 | Score: 100% | 2026-02-15T10:28:16.118414

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))