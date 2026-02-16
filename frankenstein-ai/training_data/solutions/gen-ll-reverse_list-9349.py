# Task: gen-ll-reverse_list-9349 | Score: 100% | 2026-02-13T14:09:15.116792

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))