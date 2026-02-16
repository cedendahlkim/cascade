# Task: gen-ll-reverse_list-2068 | Score: 100% | 2026-02-13T18:19:52.110186

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))