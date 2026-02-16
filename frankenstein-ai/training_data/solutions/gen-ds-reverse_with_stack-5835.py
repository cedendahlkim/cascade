# Task: gen-ds-reverse_with_stack-5835 | Score: 100% | 2026-02-13T18:24:01.562955

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))