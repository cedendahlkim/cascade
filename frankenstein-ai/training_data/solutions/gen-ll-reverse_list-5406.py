# Task: gen-ll-reverse_list-5406 | Score: 100% | 2026-02-15T08:05:33.670547

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))