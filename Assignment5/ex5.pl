/*
 * **********************************************
 * Printing result depth
 *
 * You can enlarge it, if needed.
 * **********************************************
 */
maximum_printing_depth(100).

:- current_prolog_flag(toplevel_print_options, A),
   (select(max_depth(_), A, B), ! ; A = B),
   maximum_printing_depth(MPD),
   set_prolog_flag(toplevel_print_options, [max_depth(MPD)|B]).

% Signature: unique(List, UniqueList, Dups)/3
% Purpose: succeeds if and only if UniqueList contains the same elements of List without duplicates (according to their order in List), and Dups contains the duplicates
unique(List, UniqueList, Dups) :- dupss(List, Dups), uniqueListt(List, UniqueList).

%notmember
notmember(_X,[]).
notmember(X,[Y|Ys]):- X\= Y , notmember(X,Ys).

%memberr
memberr(X, [X|_Xs]).
memberr(X, [_Y|Ys]):- memberr(X,Ys).

%deletee
deletee([], _ , []).
deletee([X|Xs], Z, [X|Ys]):- X\=Z, deletee(Xs, Z, Ys).
deletee([X|Xs], X, Ys) :- deletee(Xs,X,Ys).


%dupss
dupss([],[]).
dupss([X|Xs],[X|Ys]):- memberr(X,Xs),dupss(Xs,Ys).
dupss([X|Xs],Ys):- notmember(X,Xs),dupss(Xs,Ys).

%uniqueList
uniqueListt([],[]).
uniqueListt([X|Xs],[X|Ys]):- deletee(Xs,X,Z),uniqueListt(Z,Ys).
