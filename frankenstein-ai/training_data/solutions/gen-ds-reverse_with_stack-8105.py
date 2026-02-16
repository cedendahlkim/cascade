# Task: gen-ds-reverse_with_stack-8105 | Score: 100% | 2026-02-13T18:57:53.508326

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))