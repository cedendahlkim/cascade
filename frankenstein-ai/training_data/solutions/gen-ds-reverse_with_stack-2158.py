# Task: gen-ds-reverse_with_stack-2158 | Score: 100% | 2026-02-13T18:32:14.804579

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))