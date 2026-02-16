# Task: gen-ll-reverse_list-9101 | Score: 100% | 2026-02-13T18:46:01.213871

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))