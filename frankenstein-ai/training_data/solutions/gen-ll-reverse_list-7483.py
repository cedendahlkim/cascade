# Task: gen-ll-reverse_list-7483 | Score: 100% | 2026-02-14T12:02:47.831946

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))